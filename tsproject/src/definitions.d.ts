export type PrimitiveValue = string | number | boolean
export type SqlFn = "current_timestamp" | "current_date" | "current_time"
export type VanillaValue = { "vanilla": SqlFn | string }
export type Value = PrimitiveValue | VanillaValue | (string | VanillaValue)[] | (number | VanillaValue)[] | (boolean | VanillaValue)[]
export interface ValueMap {
  [column: string]: PrimitiveValue | VanillaValue
}

//export type NullOperator = "is null" | "is not null"
export type InOperator = "in" | "not in"
export type PrimitiveOperator = "=" | ">" | ">=" | "<" | "<=" | "<>" | "like"
export type Operator = PrimitiveOperator | InOperator

export interface SelectBuilder {
  select(select: string): this
  from(from: string): this
  join(table: string, critType: "on", leftOperand: string, op: Operator, val: Value): this
  join(table: string, critType: "on", leftOperand: string, val: Value): this
  join(table: string, critType: "on", filter: string): this
  join(table: string, critType: "using", columns: string | string[]): this
  innerJoin(table: string, critType: "on", leftOperand: string, op: Operator, val: Value): this
  innerJoin(table: string, critType: "on", leftOperand: string, val: Value): this
  innerJoin(table: string, critType: "on", filter: string): this
  innerJoin(table: string, critType: "using", columns: string | string[]): this
  leftJoin(table: string, critType: "on", leftOperand: string, op: Operator, val: Value): this
  leftJoin(table: string, critType: "on", leftOperand: string, val: Value): this
  leftJoin(table: string, critType: "on", filter: string): this
  leftJoin(table: string, critType: "using", columns: string | string[]): this
  rightJoin(table: string, critType: "on", leftOperand: string, op: Operator, val: Value): this
  rightJoin(table: string, critType: "on", leftOperand: string, val: Value): this
  rightJoin(table: string, critType: "on", filter: string): this
  rightJoin(table: string, critType: "using", columns: string | string[]): this
  outerJoin(table: string, critType: "on", leftOperand: string, op: Operator, val: Value): this
  outerJoin(table: string, critType: "on", leftOperand: string, val: Value): this
  outerJoin(table: string, critType: "on", filter: string): this
  outerJoin(table: string, critType: "using", columns: string | string[]): this
  where(leftOperand: string, op: Operator, val: Value): this
  where(leftOperand: string, val: Value): this
  where(filter: string): this
  where(andFilters: { [leftOperand: string]: Value }): this
  andWhere(leftOperand: string, op: Operator, val: Value): this
  andWhere(leftOperand: string, val: Value): this
  andWhere(filter: string): this
  andWhere(andFilters: { [leftOperand: string]: Value }): this
  orWhere(leftOperand: string, op: Operator, val: Value): this
  orWhere(leftOperand: string, val: Value): this
  orWhere(filter: string): this
  orWhere(orFilters: { [leftOperand: string]: Value }): this
  groupBy(groupBy: string): this
  having(leftOperand: string, op: Operator, val: Value): this
  having(leftOperand: string, val: Value): this
  having(filter: string): this
  having(andFilters: { [leftOperand: string]: Value }): this
  andHaving(leftOperand: string, op: Operator, val: Value): this
  andHaving(leftOperand: string, val: Value): this
  andHaving(filter: string): this
  andHaving(andFilters: { [leftOperand: string]: Value }): this
  orHaving(leftOperand: string, op: Operator, val: Value): this
  orHaving(leftOperand: string, val: Value): this
  orHaving(filter: string): this
  orHaving(orFilters: { [leftOperand: string]: Value }): this
  orderBy(orderBy: string | number): this
  toSql(): string
}

export interface InsertBuilder {
  insertInto(table: string): this
  values(values: ValueMap): this
  toSql(): string
}

export interface DeleteBuilder {
  deleteFrom(table: string): this
  where(leftOperand: string, op: Operator, val: Value): this
  where(leftOperand: string, val: Value): this
  where(filter: string): this
  where(andFilters: { [leftOperand: string]: Value }): this
  andWhere(leftOperand: string, op: Operator, val: Value): this
  andWhere(leftOperand: string, val: Value): this
  andWhere(filter: string): this
  andWhere(andFilters: { [leftOperand: string]: Value }): this
  orWhere(leftOperand: string, op: Operator, val: Value): this
  orWhere(leftOperand: string, val: Value): this
  orWhere(filter: string): this
  orWhere(orFilters: { [leftOperand: string]: Value }): this
  toSql(): string
}

export interface UpdateBuilder {
  update(table: string): this
  set(values: ValueMap): this
  where(leftOperand: string, op: Operator, val: Value): this
  where(leftOperand: string, val: Value): this
  where(filter: string): this
  where(andFilters: { [leftOperand: string]: Value }): this
  andWhere(leftOperand: string, op: Operator, val: Value): this
  andWhere(leftOperand: string, val: Value): this
  andWhere(filter: string): this
  andWhere(andFilters: { [leftOperand: string]: Value }): this
  orWhere(leftOperand: string, op: Operator, val: Value): this
  orWhere(leftOperand: string, val: Value): this
  orWhere(filter: string): this
  orWhere(orFilters: { [leftOperand: string]: Value }): this
  toSql(): string
}
