// 定义一个通用的类型，用于指定输入数组的元素类型以及分块后的子数组类型
type ChunkedArray<T> = T[][];

/**
 * 将输入数组按照指定的大小进行分块。
 *
 * @param input - 需要被分块的原始数组。
 * @param size - 每个块应该包含的元素数量。
 * @returns 一个包含按指定大小分组的子数组的新数组。
 */
export const chunk = <T>(input: T[], size: number): ChunkedArray<T> => {
  return input.reduce((arr, item, idx) => {
    if (idx % size === 0) {
      return [...arr, [item]];
    } else {
      return [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
    }
  }, [] as ChunkedArray<T>);
};
