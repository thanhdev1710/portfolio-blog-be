import { PAGE, PAGE_SIZE } from "../constants/page";
export function Skip(page: number = PAGE, pagesize: number = PAGE_SIZE) {
  return (page - 1) * pagesize;
}

export function filterObj(obj: any, fields: string[]) {
  let newObj: any = {};
  Object.keys(obj).forEach((key) => {
    if (fields.includes(key)) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
}
