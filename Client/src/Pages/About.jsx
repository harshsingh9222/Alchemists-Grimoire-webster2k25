import React from "react";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-fuchsia-900 text-white px-6 py-12">
      <div className="max-w-4xl mx-auto bg-purple-800 bg-opacity-80 rounded-2xl shadow-2xl p-8 border border-fuchsia-500">
        {/* Title */}
        <h1 className="text-4xl font-extrabold text-center text-fuchsia-300 tracking-widest mb-6">
          🎭 About the Alchemist's Grand Grimoire
        </h1>

        {/* Description */}
        <p className="text-lg leading-relaxed text-fuchsia-100 mb-6">
          As the circus's{" "}
          <span className="text-fuchsia-300">"Alchemist of the Arena"</span>,
          you brew the vital potions and elixirs that keep your performers safe
          and strong. The problem is they often forget their complex dosage
          schedules, risking their health and the entire show.
        </p>

        <p className="text-lg leading-relaxed text-fuchsia-100 mb-6">
          Your task is to build the{" "}
          <span className="text-fuchsia-300">"Alchemist's Grand Grimoire"</span>
          to ensure they never miss a dose. This magical tool will log each
          elixir's schedule (name, dosage, frequency), dispatch a{" "}
          <span className="text-fuchsia-300">"Circus Crier"</span>
          with reminders, and display a{" "}
          <span className="text-fuchsia-300">"Wellness Rate"</span>
          dashboard with charts.
        </p>

        <p className="text-lg leading-relaxed text-fuchsia-100 mb-6">
          For an advanced touch, a{" "}
          <span className="text-fuchsia-300">Mystic Fortune Teller</span>
          will predict when a performer might forget, send proactive nudges, and
          answer natural language questions. The Mystic can even sync the
          Grimoire to the
          <span className="text-fuchsia-300"> "Great Sky Calendar"</span> for
          all to see.
        </p>

        {/* Divider */}
        <div className="border-t border-fuchsia-400 my-8"></div>

        {/* Contributors */}
        <h2 className="text-2xl font-bold text-center text-fuchsia-300 mb-6">
          👥 Our Contributors
        </h2>

        <div className="flex justify-center gap-8">
          {/* Shared Avatar URL */}
          {[{ name: "Animesh" }, { name: "Harsh" }, { name: "Dhruv" }].map(
            (contributor, index) => (
              <div key={index} className="flex flex-col items-center">

                <p className="mt-2 text-lg font-semibold text-fuchsia-200">
                  {contributor.name}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default About;
