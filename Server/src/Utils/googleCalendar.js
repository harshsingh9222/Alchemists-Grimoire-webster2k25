import { google } from 'googleapis'
import oauth2Client from './googleConfig.js'
import User from '../Models/user.models.js'
import mongoose from 'mongoose'

export async function createCalendarEventForUser(userIdOrDoc, eventPayload) {
  try {
    // If an id (string or ObjectId) was passed, fetch the user. Otherwise assume a user document was passed.
    const isId = typeof userIdOrDoc === 'string' || mongoose.isValidObjectId(userIdOrDoc)
    const user = isId
      ? await User.findById(userIdOrDoc).exec()
      : userIdOrDoc

    if (!user) {
        console.log("createCalendarEventForUser: user not found for id", userIdOrDoc);
        return { success: false, error: 'User not found' }
    }
    else console.log("createCalendarEventForUser: user found:", user);
    

    const refreshToken = user?.google?.refreshToken
    if (!refreshToken) {
      console.warn('createCalendarEventForUser: no refresh token for user', user?._id)
      return { success: false, error: 'No Google refresh token for user' }
    }

  // Create a fresh OAuth2 client for this request to avoid mutating shared client state
  const client = new (google.auth.OAuth2)(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI)
    console.log('createCalendarEventForUser: setting credentials for user', user._id)
    // Do not log the full refresh token in production
    console.log('createCalendarEventForUser: refreshToken present, prefix:', String(refreshToken).slice(0,6) + '...')
    client.setCredentials({ refresh_token: refreshToken })

    // ensure access token is available (this triggers refresh if needed)
    let accessTokenResult = null
    try {
      accessTokenResult = await client.getAccessToken()
      console.log('createCalendarEventForUser: getAccessToken result keys:', Object.keys(accessTokenResult || {}))
      // accessTokenResult may be an object or a string depending on client library version
      if (accessTokenResult && typeof accessTokenResult === 'object') {
        // try to log token length (not the token)
        if (accessTokenResult.token) console.log('createCalendarEventForUser: accessToken token length:', String(accessTokenResult.token).length)
      }
    } catch (e) {
      // continue - API call will attempt to refresh too
      console.warn('googleCalendar: getAccessToken warning', e?.response?.data || e?.message || e)
    }

    const calendar = google.calendar({ version: 'v3', auth: client })
    try {
      console.log('createCalendarEventForUser: inserting event for user', user._id, 'payload summary:', eventPayload?.summary)
      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventPayload,
      })
      console.log('createCalendarEventForUser: insert response status:', res.status)
      const eventId = res?.data?.id
      console.log('createCalendarEventForUser: created event id:', eventId)
      return { success: true, eventId, data: res.data }
    } catch (insertErr) {
      console.error('createCalendarEventForUser: calendar.events.insert error:', insertErr?.response?.data || insertErr?.message || insertErr)
      return { success: false, error: insertErr?.response?.data || insertErr?.message || String(insertErr) }
    }
  } catch (err) {
    console.error('createCalendarEventForUser error:', err?.response?.data || err?.message || err)
    return { success: false, error: err?.response?.data || err?.message || String(err) }
  }
};

export async function deleteCalendarEventForUser(userIdOrDoc, eventId) {
  try {
    // Determine if userIdOrDoc is an ID or a document
    const isId = typeof userIdOrDoc === 'string' || mongoose.isValidObjectId(userIdOrDoc);
    const user = isId ? await User.findById(userIdOrDoc).exec() : userIdOrDoc;

    if (!user) {
      console.warn('deleteCalendarEventForUser: user not found for', userIdOrDoc);
      return { success: false, error: 'User not found' };
    }

    const refreshToken = user?.google?.refreshToken;
    if (!refreshToken) {
      console.warn('deleteCalendarEventForUser: no refresh token for user', user._id);
      return { success: false, error: 'No Google refresh token for user' };
    }

    // Create fresh OAuth2 client
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    client.setCredentials({ refresh_token: refreshToken });

    // Ensure access token is valid
    try {
      await client.getAccessToken();
    } catch (tokenErr) {
      console.warn('deleteCalendarEventForUser: getAccessToken warning', tokenErr?.message || tokenErr);
    }

    const calendar = google.calendar({ version: 'v3', auth: client });

    try {
      const res = await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
      console.log(`deleteCalendarEventForUser: deleted event ${eventId} for user ${user._id}`);
      return { success: true };
    } catch (deleteErr) {
      console.error(`deleteCalendarEventForUser: failed to delete event ${eventId}`, deleteErr?.message || deleteErr);
      return { success: false, error: deleteErr?.message || String(deleteErr) };
    }
  } catch (err) {
    console.error('deleteCalendarEventForUser error:', err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
};

export async function getCalendarEventDetailsForUser(userIdOrDoc, eventId) {
  try {
    // Determine if userIdOrDoc is an ID or a user document
    const isId = typeof userIdOrDoc === 'string' || mongoose.isValidObjectId(userIdOrDoc);
    const user = isId ? await User.findById(userIdOrDoc).exec() : userIdOrDoc;

    if (!user) {
      console.warn('getCalendarEventDetailsForUser: user not found for', userIdOrDoc);
      return { success: false, error: 'User not found' };
    }

    const refreshToken = user?.google?.refreshToken;
    if (!refreshToken) {
      console.warn('getCalendarEventDetailsForUser: no refresh token for user', user._id);
      return { success: false, error: 'No Google refresh token for user' };
    }

    // Create fresh OAuth2 client (to avoid shared client issues)
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    client.setCredentials({ refresh_token: refreshToken });

    // Ensure access token is valid
    try {
      await client.getAccessToken();
    } catch (tokenErr) {
      console.warn('getCalendarEventDetailsForUser: getAccessToken warning', tokenErr?.message || tokenErr);
    }

    const calendar = google.calendar({ version: 'v3', auth: client });

    // Fetch event details
    const res = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });

    console.log(`getCalendarEventDetailsForUser: fetched details for event ${eventId} (user ${user._id})`);
    return { success: true, data: res.data };

  } catch (err) {
    console.error(`getCalendarEventDetailsForUser error for event ${eventId}:`, err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
};

