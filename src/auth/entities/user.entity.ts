import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text',{
        unique: true
    })
    email: string;

    @Column('text',{
        select: false,
    })
    password: string;

    @Column('text')
    fullName: string;

    @Column('bool',{
        default: false,
        select: false,
    })
    isActive: boolean;

    @Column('text',{
        array: true,
        unique: true,
        select: false,
        default: ['user']
    })
    roles: string[];
}
