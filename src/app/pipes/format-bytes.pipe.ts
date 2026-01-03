import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatBytes',
  standalone: true
})
export class FormatBytesPipe implements PipeTransform {

  transform(value: number | undefined, decimals: number = 2): string {
    const bytes = typeof value === 'string' ? parseFloat(value) : value;

    if (!bytes || isNaN(bytes) || bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['bytes', 'kb', 'mb', 'gb', 'tb', 'pb'];

    // Tính toán số mũ để xác định đơn vị
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
}