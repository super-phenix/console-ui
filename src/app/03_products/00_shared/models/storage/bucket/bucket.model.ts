export interface BucketView {
  name: string;
  storageClass: string;
  phase?: string;
  endpoint?: string;
  maxObjects?: string;
  maxSize?: string;
  policy?: string;
  lifecycle?: string;
  creationTimestamp?: string;
}

export interface S3Config {
  storageClasses: string[];
  maxBucketSize: string;
  maxBucketObjects: number;
}

export interface BucketCredentials {
  endpoint: string;
  bucketName: string;
  region?: string;
  accessKeyId: string;
  secretAccessKey: string;
}
