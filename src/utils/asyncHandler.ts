import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Função para encapsular handlers assíncronos.
 * Ela recebe uma função assíncrona e retorna um RequestHandler compatível com o Express.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
