import Promise from 'bluebird';
import abbrev from 'abbrev';
import type { NodeJSLikeCallback } from '../types';

type Option = Partial<{
  usage: string;
  desc: string;
  init: boolean;
  arguments: {
    name: string;
    desc: string;
  }[];
  options: {
    name: string;
    desc: string;
  }[];
}>

interface Args {
  _: string[];
  [key: string]: string | boolean | string[];
}
type AnyFn = (args: Args, callback?: NodeJSLikeCallback<any>) => any;
interface StoreFunction extends AnyFn {
  desc?: string;
  options?: Option;
}

interface Store {
  [key: string]: StoreFunction
}
interface Alias {
  [abbreviation: string]: string
}

class Console {
  public store: Store;
  public alias: Alias;

  constructor() {
    this.store = {};
    this.alias = {};
  }

  /**
   * Get a console plugin function by name
   * @param {String} name - The name of the console plugin
   * @returns {StoreFunction} - The console plugin function
   */
  get(name: string): StoreFunction {
    name = name.toLowerCase();
    return this.store[this.alias[name]];
  }

  list(): Store {
    return this.store;
  }

  /**
   * Register a console plugin
   * @param {String} name - The name of console plugin to be registered
   * @param {String} desc - More detailed information about a console command
   * @param {Option} options - The description of each option of a console command
   * @param {AnyFn} fn - The console plugin to be registered
   */
  register(name: string, fn: AnyFn): void
  register(name: string, desc: string, fn: AnyFn): void
  register(name: string, options: Option, fn: AnyFn): void
  register(name: string, desc: string, options: Option, fn: AnyFn): void
  register(name: string, description: string | Option | AnyFn, options?: Option | AnyFn, funtionToProcess?: AnyFn): void {
    if (!name) throw new TypeError('name is required');

    if (funtionToProcess) {
      this.processFunction(name, description, options, funtionToProcess);
      return;
    }

    if (options && typeof options === 'function') {
      this.processOptionsFunction(name, description as AnyFn, options as AnyFn);
      return;
    }

    if (typeof description === 'function') {
      this.processDescriptionFunction(name, description as AnyFn, options as Option);
      return;
    }

    throw new TypeError('Invalid arguments provided');
  }

  getProcessFunction(fn: AnyFn): AnyFn {
    const MINIMUM_FN_LENGTH = 1;
    return fn.length > MINIMUM_FN_LENGTH ? Promise.promisify(fn) : Promise.method(fn);
  }

  private processDescriptionFunction(name: string, desc: AnyFn, options: Option | AnyFn): void {
    const functionToProcess = desc;
    options = {};
    const descString = '';
    this.processFunction(name, descString, options, functionToProcess);
  }

  private processOptionsFunction(name: string, description: AnyFn, options: Option | AnyFn): void {
    const funtionToProcess = description;
    options = {};
    const descriptionString = '';
    this.processFunction(name, descriptionString, options, funtionToProcess);

  }
  private processFunction(name: string, description: string | Option | AnyFn, options: Option | AnyFn, funtionToProcess: AnyFn): void {
    funtionToProcess = this.getProcessFunction(funtionToProcess as AnyFn);

    const processedFunction = funtionToProcess as StoreFunction;
    this.store[name.toLowerCase()] = processedFunction;
    processedFunction.options = options as Option;
    processedFunction.desc = description as string;

    this.alias = abbrev(Object.keys(this.store));
  }
}

export = Console;
