import { Pipe, PipeTransform } from '@angular/core';
import { resolveImageUrl } from '../utils/image-url';

/** `{{ post.slika.url | imageUrl }}` - turns a relative backend path (see
 * image-url.ts) into an absolute one, safe to drop straight into [src]. */
@Pipe({ name: 'imageUrl' })
export class ImageUrlPipe implements PipeTransform {
  transform(url: string | null | undefined): string | null {
    return resolveImageUrl(url);
  }
}
