import multer from "multer";

const storage= multer.diskStorage({
    destination: function(req,file,cb) {
        cb(null, './public/temp');
    }
    ,
    filename: function(req,file,cb){
        let filename=file.originalname+'-'+Date.now()+'-'+Math.round(Math.random() * 1E9);
        cb(null,filename);
    }
})

export const upload_cloud = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5 MB
    },
    //u can add more filters here as a function for specific file types and content
})