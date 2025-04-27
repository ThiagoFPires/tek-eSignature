import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  nome: string;
  email: string;
  senha: string;
}

const UserSchema = new Schema<IUser>({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true }
}, {
  timestamps: true,
  collection: 'usuarios' // Defina aqui o nome da coleção correta (se for "usuarios" ou "users")
});

export const User = mongoose.model<IUser>('User', UserSchema);
