# Phase 7: 이미지 업로드

## 🎯 목표
Cloudinary를 사용한 이미지 업로드 기능을 구현합니다.

---

## Step 7-1: Cloudinary 설정

### Cloudinary 가입
1. https://cloudinary.com 접속
2. 무료 계정 생성
3. Dashboard에서 API Keys 확인

### Backend 환경변수

#### `backend/.env`
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Step 7-2: 이미지 업로드 API

### 패키지 설치
```bash
cd backend
npm install cloudinary multer
npm install -D @types/multer
```

### Upload Module

#### `backend/src/upload/upload.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: 'mechanics' },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        )
        .end(file.buffer);
    });
  }
}
```

#### `backend/src/upload/upload.controller.ts`
```typescript
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.uploadService.uploadImage(file);
    return { url };
  }
}
```

---

## Step 7-3: Frontend 업로드 컴포넌트

### 패키지 설치
```bash
cd frontend
npm install react-dropzone
```

### `frontend/components/ImageUpload.tsx`
```typescript
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';

interface Props {
  onUpload: (url: string) => void;
  currentImage?: string;
}

export default function ImageUpload({ onUpload, currentImage }: Props) {
  const [preview, setPreview] = useState(currentImage);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/upload/image`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const { url } = await response.json();
        setPreview(url);
        onUpload(url);
      } catch (error) {
        console.error(error);
        alert('업로드 실패');
      } finally {
        setUploading(false);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  return (
    <div>
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          <button
            onClick={() => {
              setPreview(undefined);
              onUpload('');
            }}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600">
            {uploading
              ? '업로드 중...'
              : isDragActive
              ? '여기에 드롭하세요'
              : '이미지를 드래그하거나 클릭하세요'}
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## MechanicForm에 적용

### `frontend/components/admin/MechanicForm.tsx`
```typescript
import ImageUpload from './ImageUpload';

// ...

<ImageUpload
  currentImage={formData.mainImageUrl}
  onUpload={(url) => setFormData(prev => ({ ...prev, mainImageUrl: url }))}
/>
```

---

## ✅ Phase 7 완료

```bash
git push origin feature/phase-7-image-upload
```

**다음**: [Phase 8 - 반응형 & 애니메이션](./phase-8.md)
