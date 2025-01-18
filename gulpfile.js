// 必要なモジュール
import { src, dest } from 'gulp';
import imagemin, { mozjpeg, svgo } from 'gulp-imagemin';
import pngquant from 'imagemin-pngquant';
import { optimize } from 'svgo';
import through2 from 'through2';
import { deleteSync } from 'del';

// コンソールの色付け
var green = '\u001b[32m';
var reset = '\u001b[0m';

export default () => (
  deleteSync(['dist/**']),  // まず、出力先を空にしておく
  src('src/**/*.{jpg,png,svg}', { encoding: false })
    // 画像を圧縮
    .pipe(
      imagemin([
        mozjpeg({quality: 40, progressive: true}),
        pngquant({
          quality: [0.5, 0.6],
          speed: 1
        }),
        svgo()
      ])
    )
    // SVGからdata-name属性を除去
    .pipe(through2.obj((file, _enc, cb) => {
      const result = optimize(file.contents.toString(), {
        plugins: [
          {
            name: 'removeAttrs',
            params: {
              attrs: ['data-name']
            }
          }
        ]
      });
      file.contents = Buffer.from(result.data);
      cb(null, file);
    }))
    // 圧縮率を表示
    .pipe(through2.obj((file, _enc, cb) => {
      const originalSize = file.stat.size;
      const compressedSize = file.contents.length;
      const compressionRatio = Math.floor((originalSize - compressedSize) / originalSize * 100);
      console.log(` - ${green} ${file.relative} ${reset} ${originalSize} bytes -> ${compressedSize} bytes ${green} ${compressionRatio}%削減 ${reset}`);
      cb(null, file);
    }))
    // 出力
    .pipe(dest('dist'))
);
