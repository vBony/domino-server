import { Request, Response } from "express";
import {User} from '../models/User'
import bycript from "bcrypt"
import AccessTokenManager from "../helpers/token";
import { validationResult } from "express-validator";
import messageHelper from "../helpers/messages";


export const login = async (req:Request, res:Response)=>{
    const {nickname, password} = req.body

    let user = await User.findOne({where: {nickname: nickname}})

    
    if(user){
        const hashCompare = await bycript.compare(password, user.password) 
        
        if(hashCompare){
            const token = await AccessTokenManager.create(user.id)
            return res.send({token: token})
        }
    }

    return res.status(500).send({message: "Invalid credentials"})
}

export async function register(req: Request, res: Response) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.json({ error: messageHelper.get(errors.mapped()) });
    }

    const findUserByNickname = await User.findOne({ where: { nickname: req.body.nickname } });

    if(findUserByNickname){
        return res.json({ error: {nickname: "Nome de usuário em uso"} });
    }

    let model = req.body
    model.password = await bycript.hash(model.password, 2)
    const user = await User.create(req.body)

    if(user){
        return res.status(200)
    }
}

export async function getRegister(req: Request, res: Response) {
    let nome = req.params.name

    res.json({name: nome})
}