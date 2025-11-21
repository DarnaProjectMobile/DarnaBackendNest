import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Role } from 'src/auth/common/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  // 👇 Add this line
  _id: Types.ObjectId;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: Object.values(Role), default: Role.Client })
  role: Role;

  @Prop({ required: true })
  dateDeNaissance: string;

  @Prop({ required: true })
  numTel: string;

  @Prop({ required: true, enum: ['Male', 'Female'] })
  gender: string;

  @Prop()
  image?: string;

  @Prop()
  resetCode?: string;

  @Prop({ type: Number, default: 0 })
  credits: number;

  @Prop({ type: Number, default: 0 })
  ratingAvg: number;

  @Prop({ type: [String], default: [] })
  badges: string[];

  @Prop({ required: false })
  verificationCode?: string;

  @Prop({ default: false })
  isVerified: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
