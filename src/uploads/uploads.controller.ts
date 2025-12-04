import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  @Get('chat/:filename')
  @ApiOperation({ summary: 'Récupérer une image de chat' })
  @ApiParam({ name: 'filename', description: 'Nom du fichier image' })
  @ApiResponse({ status: 200, description: 'Image retournée avec succès' })
  @ApiResponse({ status: 404, description: 'Fichier non trouvé' })
  async getChatImage(@Param('filename') filename: string, @Res() res: Response) {
    return this.serveFile('chat', filename, res);
  }

  @Get('users/:filename')
  @ApiOperation({ summary: 'Récupérer une image de profil utilisateur' })
  @ApiParam({ name: 'filename', description: 'Nom du fichier image' })
  @ApiResponse({ status: 200, description: 'Image retournée avec succès' })
  @ApiResponse({ status: 404, description: 'Fichier non trouvé' })
  async getUserImage(@Param('filename') filename: string, @Res() res: Response) {
    return this.serveFile('users', filename, res);
  }

  @Get('visites/:filename')
  @ApiOperation({ summary: 'Récupérer une image de visite' })
  @ApiParam({ name: 'filename', description: 'Nom du fichier image' })
  @ApiResponse({ status: 200, description: 'Image retournée avec succès' })
  @ApiResponse({ status: 404, description: 'Fichier non trouvé' })
  async getVisiteImage(@Param('filename') filename: string, @Res() res: Response) {
    return this.serveFile('visites', filename, res);
  }

  @Get('visites/confirmation/:filename')
  @ApiOperation({ summary: 'Récupérer une image de confirmation de visite' })
  @ApiParam({ name: 'filename', description: 'Nom du fichier image' })
  @ApiResponse({ status: 200, description: 'Image retournée avec succès' })
  @ApiResponse({ status: 404, description: 'Fichier non trouvé' })
  async getVisiteConfirmationImage(@Param('filename') filename: string, @Res() res: Response) {
    return this.serveFile('visites/confirmation', filename, res);
  }

  @Get('*')
  @ApiOperation({ summary: 'Récupérer un fichier uploadé (route générique)' })
  async getFile(@Param('0') path: string, @Res() res: Response) {
    // Nettoyer le chemin pour enlever les espaces et caractères invalides
    const cleanedPath = path
      .replace(/\s+/g, '')
      .replace(/chat\s*\/+/g, 'chat/')
      .replace(/\s*\/+\s*/g, '/');
    
    // Extraire le dossier et le nom de fichier
    const parts = cleanedPath.split('/').filter(p => p);
    
    if (parts.length < 2) {
      throw new NotFoundException('Chemin de fichier invalide');
    }
    
    const folder = parts.slice(0, -1).join('/');
    const filename = parts[parts.length - 1];
    
    return this.serveFile(folder, filename, res);
  }

  private async serveFile(folder: string, filename: string, res: Response) {
    try {
      // Nettoyer le nom de fichier pour éviter les injections de chemin
      const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '');
      const cleanFolder = folder.replace(/[^a-zA-Z0-9/_-]/g, '');
      
      // Construire le chemin complet
      const filePath = join(process.cwd(), 'uploads', cleanFolder, cleanFilename);
      
      // Vérifier que le fichier existe
      if (!existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        throw new NotFoundException(`Fichier non trouvé: ${cleanFilename}`);
      }
      
      // Déterminer le type MIME
      const mimeType = this.getMimeType(cleanFilename);
      
      // Définir les headers
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache pour 1 an
      
      // Envoyer le fichier
      res.sendFile(filePath);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error(`❌ Error serving file: ${folder}/${filename}`, error);
      throw new NotFoundException(`Erreur lors de la récupération du fichier: ${filename}`);
    }
  }

  private getMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}

