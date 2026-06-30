declare module 'esdk-obs-nodejs' {
  export interface OBSConfig {
    access_key_id: string
    secret_access_key: string
    server: string
  }

  export interface ListObjectsResult {
    CommonMsg: {
      Status: number
      Code?: string
      Message?: string
    }
    InterfaceResult: {
      Contents?: Array<{
        Key: string
        Size: number
        LastModified: string
        ETag: string
      }>
      CommonPrefixes?: Array<{
        Prefix: string
      }>
      IsTruncated?: boolean | string
      NextMarker?: string
    }
  }

  export interface GetObjectResult {
    CommonMsg: {
      Status: number
      Code?: string
      Message?: string
    }
    InterfaceResult: {
      Content: Buffer
      Metadata?: Record<string, string>
    }
  }

  export interface PutObjectResult {
    CommonMsg: {
      Status: number
      Code?: string
      Message?: string
    }
    InterfaceResult?: {
      ETag?: string
      VersionId?: string
    }
  }

  export interface DeleteObjectResult {
    CommonMsg: {
      Status: number
      Code?: string
      Message?: string
    }
    InterfaceResult?: Record<string, unknown>
  }

  export interface DeleteObjectsResult {
    CommonMsg: {
      Status: number
      Code?: string
      Message?: string
    }
    InterfaceResult?: {
      Deleteds?: Array<{
        Key: string
        DeleteMarker: boolean
      }>
      Errors?: Array<{
        Key: string
        Code: string
        Message: string
      }>
    }
  }

  export interface GetObjectMetadataResult {
    CommonMsg: {
      Status: number
      Code?: string
      Message?: string
    }
    InterfaceResult?: {
      ContentLength?: number
      LastModified?: string
      ETag?: string
      Metadata?: Record<string, string>
    }
  }

  class ObsClient {
    constructor(config: OBSConfig)

    headBucket(
      params: { Bucket: string },
      callback: (err: Error | null, result: { CommonMsg: { Status: number } }) => void
    ): void

    listObjects(
      params: {
        Bucket: string
        Prefix?: string
        Marker?: string
        MaxKeys?: number
        Delimiter?: string
      },
      callback: (err: Error | null, result: ListObjectsResult) => void
    ): void

    getObject(
      params: {
        Bucket: string
        Key: string
        SaveAsStream?: boolean
      },
      callback: (err: Error | null, result: GetObjectResult) => void
    ): void

    putObject(
      params: {
        Bucket: string
        Key: string
        Body?: Buffer | string
        Metadata?: Record<string, string>
      },
      callback: (err: Error | null, result: PutObjectResult) => void
    ): void

    deleteObject(
      params: {
        Bucket: string
        Key: string
      },
      callback: (err: Error | null, result: DeleteObjectResult) => void
    ): void

    deleteObjects(
      params: {
        Bucket: string
        Quiet?: boolean
        Delete: {
          Objects: Array<{ Key: string }>
        }
      },
      callback: (err: Error | null, result: DeleteObjectsResult) => void
    ): void

    getObjectMetadata(
      params: {
        Bucket: string
        Key: string
      },
      callback: (err: Error | null, result: GetObjectMetadataResult) => void
    ): void
  }

  export default ObsClient
}
