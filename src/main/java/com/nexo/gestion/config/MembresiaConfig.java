package com.nexo.gestion.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.membresia")
public class MembresiaConfig {
    private int periodoGracia = 0;

    public int getPeriodoGracia() {
        return periodoGracia;
    }

    public void setPeriodoGracia(int periodoGracia) {
        this.periodoGracia = periodoGracia;
    }
}

