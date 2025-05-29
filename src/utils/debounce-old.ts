/**
 * 防抖函数，用于限制函数的执行频率
 * @param func 要执行的函数
 * @param wait 延迟执行的时间，单位为毫秒，默认为 300 毫秒
 * @param immediate 是否立即执行一次，如果为 true，则在第一次调用时立即执行，之后再进行限制；如果为 false，则等到延迟时间后再执行
 */
let timeout: ReturnType<typeof setTimeout> | null = null;

type DebounceFunction = (...args: any[]) => void;

const debounce = (func: DebounceFunction, wait: number = 300, immediate: boolean = false): Function => {
    return (...args: any[]): void => {
        // 清除定时器
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        // 立即执行，此类情况一般用不到
        if (immediate) {
            const callNow = !timeout;
            timeout = setTimeout(() => {
                timeout = null;
            }, wait);
            if (callNow) typeof func === 'function' && func(...args);
        } else {
            // 设置定时器，当最后一次操作后，timeout不会再被清除，所以在延时wait毫秒后执行func回调方法
            timeout = setTimeout(() => {
                typeof func === 'function' && func(...args);
            }, wait);
        }
    };
};

export default debounce; 