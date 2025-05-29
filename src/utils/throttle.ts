/**
 * 节流函数，用于减少函数的执行次数。
 * @param func 需要节流的函数
 * @param wait 节流的时间间隔，默认为 300 毫秒
 * @param immediate 是否立即执行，true 表示在时间间隔的开始处执行，false 表示在时间间隔的结束处执行，默认为 true
 * @returns 节流后的函数
 */
let timer: ReturnType<typeof setTimeout> | null = null;
let flag: boolean = false;

type ThrottleFunction = (...args: any[]) => void;

const throttle = (func: ThrottleFunction, wait: number = 300, immediate: boolean = true): Function => {
  return (...args: any[]): void => {
    if (immediate) {
      if (!flag) {
        flag = true;
        // 如果是立即执行，则在wait毫秒内开始时执行
        typeof func === "function" && func(...args);
        timer = setTimeout(() => {
          flag = false;
        }, wait);
      }
    } else {
      if (!flag) {
        flag = true;
        // 如果是非立即执行，则在wait毫秒内的结束处执行
        timer = setTimeout(() => {
          flag = false;
          typeof func === "function" && func(...args);
        }, wait);
      }
    }
  };
};

export default throttle; 