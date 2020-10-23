// Vendor
import { ModuleFormat, RollupOptions } from 'rollup';
import commonjs from 'rollup-plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';

const formats: ModuleFormat[] = ['esm', 'umd'];

export default formats.map(
  (format): RollupOptions => ({
    input: './src/index.ts',
    output: {
      file: `./dist/taskwork.${format}.js`,
      format,
      name: 'Taskwork',
    },
    plugins: [
      terser({
        format: {
          comments: false,
        },
      }),
      filesize(),
      typescript(
        ['esm'].includes(format)
          ? {}
          : {
              tsconfigOverride: {
                compilerOptions: {
                  target: 'es5',
                },
              },
            }
      ),
      resolve(),
      commonjs(),
    ],
  })
);
