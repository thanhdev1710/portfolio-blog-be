import { PAGE, PAGE_SIZE } from "../constants/page";
export function Skip(page: number = PAGE, pagesize: number = PAGE_SIZE) {
  return (page - 1) * pagesize;
}
