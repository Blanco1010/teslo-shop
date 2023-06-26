import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dtos/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/interfaces';

// @WebSocketGateway({cors:true})
@WebSocketGateway(80,{cors:true, namespace: '/'})
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() wss: Server;

  constructor(
    private readonly messagesWsService: MessagesWsService,
    private readonly jwtService: JwtService,
    ) {}


  async handleConnection(client: Socket) {
    const token = client.handshake.headers['authentication'] as string;
    let payload: JwtPayload;

    try{
      payload = this.jwtService.verify(token);
      await this.messagesWsService.registerClient(client,payload.id);
    }catch(error){
      client.disconnect();
      return;
    }

    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients());
    
    // console.log({conectados: this.messagesWsService.getConnectedClients()});
  }
  handleDisconnect(client: Socket) {
    // console.log('Disconnect: ', client.id);
    this.messagesWsService.removeClient(client.id);
    
    this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients());
  }

  @SubscribeMessage('message-from-client')
  onMessageFromClient(client: Socket, payload: NewMessageDto){

    //! Emit only client
  //   client.emit('message-from-server', {
  //     fullName: 'Soy yo!',
  //     message: payload,
  //   });

  //! Emit all client except client initial
  // client.broadcast.emit('message-from-server', {
  //   fullName: 'Soy yo!',
  //   message: payload,
  // });

  this.wss.emit('message-from-server', {
    fullName: this.messagesWsService.getUserFullName(client.id),
    message: payload.message,
  });
  }

}
