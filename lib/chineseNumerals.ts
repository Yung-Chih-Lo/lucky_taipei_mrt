const DIGIT_MAP: Record<string, string> = {
  '0': '零',
  '1': '壹',
  '2': '貳',
  '3': '參',
  '4': '肆',
  '5': '伍',
  '6': '陸',
  '7': '柒',
  '8': '捌',
  '9': '玖',
}

export function toChineseNumerals(digits: string): string {
  let out = ''
  for (const ch of digits) {
    out += DIGIT_MAP[ch] ?? ch
  }
  return out
}
