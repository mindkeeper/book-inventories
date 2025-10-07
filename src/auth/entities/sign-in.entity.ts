import { ApiProperty } from '@nestjs/swagger';

export class SignInEntity {
  @ApiProperty({
    example: 'johndoe@mail.co',
    description: 'User email',
  })
  email: string;

  @ApiProperty({
    example: 'secret123',
    description: 'User password',
  })
  password: string;
}

export class SignInResponse {
  @ApiProperty({
    example: 'dfdsaffajdfk',
    description: 'access token',
  })
  access_token: string;
}

export class SignInError {
  @ApiProperty({
    example: 401,
    description: 'HTTP status code',
  })
  statusCode: number;

  @ApiProperty({
    example: 'Unauthorized',
    description: 'Error title',
  })
  error: string;

  @ApiProperty({
    example: 'Invalid credentials',
    description: 'Error message',
  })
  message: string;
}
