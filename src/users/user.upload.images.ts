import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

export const userImageUpload = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = './uploads/users';
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const extension = extname(file.originalname); // keep original extension
      cb(null, uniqueSuffix + extension);
    },
  }),
  fileFilter: (req, file, cb) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      cb(new Error('Seuls les fichiers images sont autorisés!'), false);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      cb(null, true);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
};
