/**
 * JsonPrimitive: tipos básicos permitidos
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 * Json<T> genérico, recursivo:
 * - se T for primitivo, Json<T> pode ser primitivo, array ou objeto
 * - se T for um shape específico (por ex interface MessageData),
 *   Json<T> garante que o payload respeita esse shape
 */
export type Json<T = JsonPrimitive> = T | JsonObject<T> | JsonArray<T>;

/**
 * Objeto genérico com propriedades de Json<T>
 */
export interface JsonObject<T = JsonPrimitive> {
	[key: string]: Json<T>;
}

/**
 * Array genérico de Json<T>
 */
export type JsonArray<T = JsonPrimitive> = Array<Json<T>>;
