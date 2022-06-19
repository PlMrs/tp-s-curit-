import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserRole } from 'src/users/entities/user.entity';

enum CHANNEL { MESSAGE = "message"};

@WebSocketGateway()
export class EventsGateway {

  private static LOGGER : Logger = new Logger('Gateway')
  private static GRANT = [UserRole.CUSTOMER, UserRole.ADMIN]

  @WebSocketServer()
  private server : Server;

  private users : Array<{user_id:number,socket_id:string}> = []

  handleConnection(socket: Socket){
    const {token : auth} = socket.handshake.auth
 
    const token = auth && auth.startsWith("Bearer ") ? auth.substring(7) : null
    if(token){
      const jwts = new JwtService({ secret : process.env.JWT_SECRET })
      const claims = jwts.decode(token) as [key:string]
      const role = claims && claims["role"] ? claims["role"] : null
      if(role && EventsGateway.GRANT.includes(role)){

        if(this.users.filter(e => e.user_id === Number(socket.handshake.query.me)).length === 0){
          this.users.push({user_id: Number(socket.handshake.query.me), 
            socket_id: socket.id
          })
        }

        const ip = socket.client.conn.remoteAddress;
        EventsGateway.LOGGER.log(CHANNEL.MESSAGE, `Welcome @${socket.id} on @${ip}`)
        return;

      }
    }
    socket.disconnect();
  }

  @SubscribeMessage(CHANNEL.MESSAGE)
  handleMessage(@ConnectedSocket() socket: Socket,@MessageBody() payload: {user_id : number, message : string}) {
    const [user] = this.users.filter(e => e.user_id === payload.user_id)

    if(!user){
      return
    }

    EventsGateway.LOGGER.log(`Sender ${socket.id} to ${user.socket_id} : ${payload.message}`)
    
    socket.to(user.socket_id).emit(CHANNEL.MESSAGE, payload.message)

    return 'ok';
  }

  handleDisconnect(socket: Socket){
    const newUsers = this.users.filter(e => e.user_id != Number(socket.handshake.query.me))
    this.users = newUsers
    this.server.emit(CHANNEL.MESSAGE, `Déconnecté`)
  }
}
