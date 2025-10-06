import { ApiProperty } from '@nestjs/swagger';

export class SignUpEntity {
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
