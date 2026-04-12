import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ApiVersion } from '../dto/api-response.dto';

export interface ApiVersionRequest extends Request {
  apiVersion?: ApiVersion;
}

@Injectable()
export class ApiVersionMiddleware implements NestMiddleware {
  use(req: ApiVersionRequest, res: Response, next: NextFunction) {
    const versionHeader = req.headers['x-api-version'];
    const acceptHeader = req.headers['accept'];

    let version: ApiVersion = 'v1';

    if (versionHeader && ['v1', 'v2'].includes(versionHeader as string)) {
      version = versionHeader as ApiVersion;
    } else if (
      acceptHeader &&
      acceptHeader.includes('application/vnd.duanruo.v2+json')
    ) {
      version = 'v2';
    }

    const urlMatch = req.url.match(/^\/api\/(v1|v2)/);
    if (urlMatch) {
      version = urlMatch[1] as ApiVersion;
    }

    req.apiVersion = version;
    next();
  }
}
