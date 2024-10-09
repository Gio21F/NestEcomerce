import { diskStorage } from 'multer';
import { fileFilter } from './fileFilter.helper';
import { fileNames } from './fileName.helper';
export const multerOptionsOne = {
  storage: diskStorage({
    destination: './static/users',
    filename: fileNames,
  }),
  fileFilter: fileFilter,
}
export const multerOptionsMany = {
  storage: diskStorage({
    destination: './static/products',
    filename: fileNames,
  }),
  limits: {
    files: 10,
  },
  fileFilter: fileFilter,
};
