import { diskStorage } from 'multer';
import { fileFilter } from './fileFilter.helper';
import { fileNames } from './fileName.helper';

export const multerOptions = {
  storage: diskStorage({
    destination: './static/products',
    filename: fileNames,
  }),
  limits: {
    files: 10,
  },
  fileFilter: fileFilter,
};
