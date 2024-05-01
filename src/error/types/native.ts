export interface NativeErrorType {
  code?: string
  name?: string
  message: string
  cause?: Error
}
