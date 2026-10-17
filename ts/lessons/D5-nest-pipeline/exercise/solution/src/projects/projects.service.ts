import { Injectable } from '@nestjs/common';
import { AccessDeniedError, NotFoundError } from '../domain/errors';

export interface Project {
  id: string;
  name: string;
  ownerId: string;
}

@Injectable()
export class ProjectsService {
  private readonly projects = new Map<string, Project>([
    ['p1', { id: 'p1', name: 'Apollo', ownerId: 'u1' }],
    ['p2', { id: 'p2', name: 'Gemini', ownerId: 'u2' }],
  ]);
  private nextId = 3;

  listFor(ownerId: string): Project[] {
    return [...this.projects.values()].filter((p) => p.ownerId === ownerId);
  }

  getFor(ownerId: string, id: string): Project {
    const project = this.projects.get(id);
    if (!project) throw new NotFoundError('project', id);
    if (project.ownerId !== ownerId) throw new AccessDeniedError(`project ${id} belongs to someone else`);
    return project;
  }

  create(ownerId: string, name: string): Project {
    const project = { id: `p${this.nextId++}`, name, ownerId };
    this.projects.set(project.id, project);
    return project;
  }
}
