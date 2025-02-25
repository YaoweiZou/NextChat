export function getDateStr(date: Date, showSeconds?: boolean) {
  let dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
  if (showSeconds) {
    return `${dateStr}:${date.getSeconds()}`;
  }
  return dateStr;
}
