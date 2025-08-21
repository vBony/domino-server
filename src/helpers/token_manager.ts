import bycript, { hash } from "bcrypt"
import { AccessTokens } from "../models/AccessTokens";
import moment from "moment";

class AccessTokenManager {
    static expires = 30
    
    static async create(idUser:number){
        const date = new Date().toLocaleDateString('en-US');
        const randomNumber = Math.floor(Math.random() * 90000) + 10000;

        let expires = moment().add(this.expires, 'days');

        const token = await bycript.hash(date+randomNumber, 2)
        let model = {
            user_id: idUser,
            hash: token,
            created_at: moment().format('YYYY/MM/DD HH:mm:ss'),
            expires_at: expires.format('YYYY/MM/DD HH:mm:ss')
        }
    
        const result = await AccessTokens.create(model)

        return result.hash
    }
}

export default AccessTokenManager