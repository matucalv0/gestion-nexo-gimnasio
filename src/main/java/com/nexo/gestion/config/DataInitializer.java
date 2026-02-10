package com.nexo.gestion.config;

import com.nexo.gestion.entity.MedioPago;
import com.nexo.gestion.entity.Rol;
import com.nexo.gestion.entity.Usuario;
import com.nexo.gestion.repository.MedioPagoRepository;
import com.nexo.gestion.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final MedioPagoRepository medioPagoRepository;

    public DataInitializer(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, MedioPagoRepository medioPagoRepository) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.medioPagoRepository = medioPagoRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        initializeAdminUser();
        initializePaymentMethods();
    }

    private void initializeAdminUser() {
        if (usuarioRepository.findByUsername("admin").isEmpty()) {
            log.info("Iniciando creación de usuario administrador por defecto...");
            Usuario admin = new Usuario();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRol(Rol.ADMIN);
            admin.setActivo(true);
            
            usuarioRepository.save(admin);
            log.info("Usuario administrador creado exitosamente: admin / admin123");
        } else {
            log.info("El usuario administrador ya existe. Saltando inicialización.");
            
            // Forzar actualización de contraseña si algo salió mal manualmente
            Usuario admin = usuarioRepository.findByUsername("admin").get();
            admin.setPassword(passwordEncoder.encode("admin123"));
            usuarioRepository.save(admin);
            log.info("Contraseña de admin reiniciada para asegurar compatibilidad.");
        }
    }

    private void initializePaymentMethods() {
        List<String> defaultMethods = List.of("EFECTIVO", "TRANSFERENCIA");
        for (String methodName : defaultMethods) {
            if (!medioPagoRepository.existsByNombre(methodName)) {
                log.info("Creando medio de pago por defecto: {}", methodName);
                MedioPago medioPago = new MedioPago(methodName);
                medioPagoRepository.save(medioPago);
            }
        }
    }
}
