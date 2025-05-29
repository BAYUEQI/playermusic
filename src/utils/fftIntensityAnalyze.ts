export function analyzeAudioIntensity(fftData: number[]): number {
  // 确保输入数据长度为 256
  if (fftData.length !== 256) {
    throw new Error("FFT data must contain 256 elements");
  }

  // 计算幅度谱
  const magnitudeSpectrum = fftData.map(value => Math.abs(value));

  // 去除直流分量（第一个元素）
  const spectrum = magnitudeSpectrum.slice(1);

  // 计算平均幅度
  const averageMagnitude = spectrum.reduce((sum, value) => sum + value, 0) / spectrum.length;

  // 计算标准差
  const variance = spectrum.reduce((sum, value) => sum + Math.pow(value - averageMagnitude, 2), 0) / spectrum.length;
  const stdDeviation = Math.sqrt(variance);

  // 计算峰值
  const peak = Math.max(...spectrum);

  // 检查峰值是否为零
  if (peak === 0) {
    return 0;
  }

  // 计算烈度指标
  const intensity = (averageMagnitude + stdDeviation) / peak;

  // 将烈度映射到0-1范围，并处理 NaN 情况
  const normalizedIntensity = isNaN(intensity) ? 0 : Math.min(Math.max(intensity, 0), 1);

  return normalizedIntensity;
}

