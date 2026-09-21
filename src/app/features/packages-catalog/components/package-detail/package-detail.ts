import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImageUrlPipe } from '../../../../core/pipes/image-url-pipe';
import { PackagePublicDetail } from '../../models/package';

@Component({
  selector: 'app-package-detail',
  imports: [CommonModule, RouterLink, ImageUrlPipe],
  templateUrl: './package-detail.html',
  styleUrl: './package-detail.scss',
})
export class PackageDetail {
  pkg = input<PackagePublicDetail | null>(null);
}
