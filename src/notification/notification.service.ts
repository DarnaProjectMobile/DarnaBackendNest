import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const createdNotification = new this.notificationModel(
      createNotificationDto,
    );
    return createdNotification.save();
  }

  async findAll(): Promise<Notification[]> {
    return this.notificationModel.find().exec();
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationModel.findById(id).exec();
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return notification;
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return this.notificationModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ userId, isRead: false })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.notificationModel
      .findByIdAndUpdate(id, { isRead: true }, { new: true })
      .exec();

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel
      .updateMany({ userId, isRead: false }, { isRead: true })
      .exec();
  }

  async update(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const updatedNotification = await this.notificationModel
      .findByIdAndUpdate(id, updateNotificationDto, { new: true })
      .exec();

    if (!updatedNotification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return updatedNotification;
  }

  async remove(id: string): Promise<void> {
    const result = await this.notificationModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
  }
}
