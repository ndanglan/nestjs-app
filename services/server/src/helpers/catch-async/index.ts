import { HttpException, HttpStatus } from '@nestjs/common';

export async function catchAsync<T = any>(
  fn: () => Promise<T> | T,
  fallbackValue?: T,
) {
  try {
    return await fn();
  } catch (error) {
    // Log lỗi để debug
    console.error('Error caught in catchAsync:', error);

    // Nếu là HttpException thì throw tiếp
    if (error instanceof HttpException) {
      throw error;
    }

    // Nếu có fallbackValue thì trả về fallbackValue
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }

    // Mặc định throw HttpException nếu không có fallbackValue
    throw new HttpException(
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal server error',
        message: 'Đã xảy ra lỗi, vui lòng thử lại sau',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
