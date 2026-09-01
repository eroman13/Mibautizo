/**
 * Controlador para gestión de usuarios administradores
 */

import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Obtener todos los usuarios admin
 * GET /api/admin-users
 */
export async function getAllAdminUsers(req: Request, res: Response) {
  try {
    const users = await prisma.adminUser.findMany({
      select: {
        id: true,
        username: true,
        nombre: true,
        email: true,
        activo: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
}

/**
 * Crear nuevo usuario admin
 * POST /api/admin-users
 */
export async function createAdminUser(req: Request, res: Response) {
  try {
    const { username, password, nombre, email } = req.body;

    // Validar campos obligatorios
    if (!username || !password || !nombre) {
      return res.status(400).json({
        success: false,
        error: 'Usuario, contraseña y nombre son requeridos',
      });
    }

    // Verificar que el usuario no exista
    const existingUser = await prisma.adminUser.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'El usuario ya existe',
      });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const newUser = await prisma.adminUser.create({
      data: {
        username,
        password: hashedPassword,
        nombre,
        email: email || null,
      },
      select: {
        id: true,
        username: true,
        nombre: true,
        email: true,
        activo: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: newUser,
      message: 'Usuario creado exitosamente',
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
}

/**
 * Actualizar usuario admin
 * PUT /api/admin-users/:id
 */
export async function updateAdminUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { nombre, email, activo, password } = req.body;

    const userId = parseInt(String(id));

    // Preparar datos a actualizar
    const updateData: any = {};
    if (nombre) updateData.nombre = nombre;
    if (email) updateData.email = email;
    if (typeof activo === 'boolean') updateData.activo = activo;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.adminUser.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        nombre: true,
        email: true,
        activo: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Usuario actualizado exitosamente',
    });
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
}

/**
 * Eliminar usuario admin
 * DELETE /api/admin-users/:id
 */
export async function deleteAdminUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = parseInt(String(id));

    // Verificar que no sea el único usuario
    const totalUsers = await prisma.adminUser.count();
    if (totalUsers <= 1) {
      return res.status(400).json({
        success: false,
        error: 'No puedes eliminar el único usuario administrador',
      });
    }

    await prisma.adminUser.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
}
