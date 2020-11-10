const { io } = require('../server');
const { Usuarios } = require('../classes/usuarios');
const { crearMensaje } = require('../utilidades/utilidades');

const usuarios = new Usuarios();

io.on('connection', (client) => {

    client.on('entrarChat', (res, callback) => {
        if(!res.nombre || !res.sala){
            return callback({
                error: true,
                mensaje: 'El nombre/sala es necesario'
            });
        }

        client.join(res.sala);
        
        let personas = usuarios.agregarPersonas(client.id, res.nombre, res.sala);

        client.broadcast.to(res.sala).emit('listaPersona', usuarios.getPersonasPorSala(res.sala));

        callback(usuarios.getPersonasPorSala(res.sala));

    });

    client.on('crearMensaje', (data) => {
        let persona = usuarios.getPersona(client.id);

        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(data.sala).emit('crearMensaje', mensaje);
    })
    
    // Mensajes privados
    client.on('mensajePrivado', data => {
        let persona = usuarios.getPersona(client.id);

        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));
    });

    client.on('disconnect', () => {
        let personaBorrada = usuarios.borrarPersona(client.id);
        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Administrador', `${personaBorrada.nombre} salió`));
        client.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonasPorSala(personaBorrada.sala));
    });

});