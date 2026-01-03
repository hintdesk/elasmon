import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'msToDaysHours',
  standalone: true
})
export class MsToDaysHoursPipe implements PipeTransform {

  transform(value: number | string | null | undefined): string {
    if (value == null || isNaN(Number(value))) return '0d 0h';

    const ms = Number(value);

    // Định nghĩa các hằng số
    const msInHour = 1000 * 60 * 60;
    const msInDay = msInHour * 24;

    // Tính toán
    const days = Math.floor(ms / msInDay);
    const hours = Math.floor((ms % msInDay) / msInHour);

    // Trả về chuỗi định dạng
    return `${days}d ${hours}h`;
  }
}