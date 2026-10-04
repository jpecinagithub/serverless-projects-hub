// Registered via: node --import ./test/register-loader.mjs ...
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register(pathToFileURL('./test/hooks.mjs'), pathToFileURL('./'));
