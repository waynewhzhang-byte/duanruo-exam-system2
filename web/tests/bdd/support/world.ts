import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import axios from 'axios';

export class CustomWorld extends World {
  constructor(options: IWorldOptions) {
    super(options);
  }

  token?: string;
  userId?: string;
  roles?: string[];
  tenantRoles?: any[];
  lastResponse?: any;
  lastError?: any;
  currentExam?: any;
  currentApplication?: any;

  async apiPost(path: string, body: any, headers: any = {}) {
    try {
      const response = await axios.post(
        `http://localhost:8081/api/v1${path}`,
        body,
        { headers: { ...headers, Authorization: `Bearer ${this.token}` } }
      );
      this.lastResponse = response.data;
      return response.data;
    } catch (error: any) {
      this.lastError = error;
      throw error;
    }
  }

  async apiGet(path: string, headers: any = {}) {
    try {
      const response = await axios.get(
        `http://localhost:8081/api/v1${path}`,
        { headers: { ...headers, Authorization: `Bearer ${this.token}` } }
      );
      this.lastResponse = response.data;
      return response.data;
    } catch (error: any) {
      this.lastError = error;
      throw error;
    }
  }
}

setWorldConstructor(CustomWorld);
