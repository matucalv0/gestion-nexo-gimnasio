package com.nexo.gestion.config;

import com.nexo.gestion.entity.MedioPago;
import com.nexo.gestion.entity.Rol;
import com.nexo.gestion.entity.Usuario;
import com.nexo.gestion.repository.MedioPagoRepository;
import com.nexo.gestion.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Inicializa datos por defecto después de que Flyway complete las migraciones.
 * Spring Boot garantiza que Flyway se ejecute antes que cualquier ApplicationRunner.
 */
@Component
@Order(1)
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final MedioPagoRepository medioPagoRepository;

    public DataInitializer(UsuarioRepository usuarioRepository,
                          PasswordEncoder passwordEncoder,
                          MedioPagoRepository medioPagoRepository) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.medioPagoRepository = medioPagoRepository;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        try {
            initializeAdminUser();
            initializePaymentMethods();
            log.info("Inicialización de datos completada correctamente.");
        } catch (Exception e) {
            log.error("Error durante la inicialización de datos: {}", e.getMessage());
            throw e;
        }
    }

    private void initializeAdminUser() {
        if (usuarioRepository.findByUsername("admin").isEmpty()) {
            String adminPassword = System.getenv("ADMIN_INITIAL_PASSWORD");
            if (adminPassword == null || adminPassword.length() < 8) {
                log.warn("ADMIN_INITIAL_PASSWORD no configurada. Usando password temporal 'admin123'. CAMBIAR EN PRODUCCIÓN.");
                adminPassword = "admin123";
            }

            log.info("Creando usuario administrador por defecto...");
            Usuario admin = new Usuario();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRol(Rol.ADMIN);
            admin.setActivo(true);
            
            usuarioRepository.save(admin);
            log.info("Usuario administrador creado exitosamente.");
        } else {
            log.debug("El usuario administrador ya existe.");
        }
    }

    private void initializePaymentMethods() {
        List<String> defaultMethods = List.of("EFECTIVO", "TRANSFERENCIA");
        for (String methodName : defaultMethods) {
            if (!medioPagoRepository.existsByNombre(methodName)) {
                log.info("Creando medio de pago: {}", methodName);
                MedioPago medioPago = new MedioPago(methodName);
                medioPagoRepository.save(medioPago);
            }
        }
    }
}
