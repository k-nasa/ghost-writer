import type { Argv } from "yargs";

export interface BaseArguments {
  _: (string | number)[];
  $0: string;
}

export interface CreateArguments extends BaseArguments {
  title: string;
  parent?: string;
  description?: string;
}

export interface ListArguments extends BaseArguments {
  status?: string | string[];
  format?: string;
  tree?: boolean;
  json?: boolean;
}

export interface ApproveArguments extends BaseArguments {
  ids: string[];
}

export interface TakeArguments extends BaseArguments {
  id: string;
  agent?: string;
  force?: boolean;
}

export interface StatusArguments extends BaseArguments {
  format?: string;
  json?: boolean;
}

export interface AvailableArguments extends BaseArguments {
  format?: string;
}