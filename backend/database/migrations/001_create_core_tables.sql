CREATE TABLE administrators (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY administrators_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE clients (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    email VARCHAR(254) NULL,
    phone VARCHAR(40) NULL,
    external_reference VARCHAR(80) NULL,
    notes TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY clients_external_reference_unique (external_reference),
    KEY clients_name_index (name),
    CONSTRAINT clients_created_by_foreign FOREIGN KEY (created_by) REFERENCES administrators (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ledger_entries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT UNSIGNED NOT NULL,
    type ENUM('earning', 'expense') NOT NULL,
    amount_minor BIGINT UNSIGNED NOT NULL,
    occurred_on DATE NOT NULL,
    description VARCHAR(500) NOT NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    voided_at TIMESTAMP NULL,
    voided_by BIGINT UNSIGNED NULL,
    void_reason VARCHAR(500) NULL,
    replacement_entry_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ledger_amount_positive CHECK (amount_minor > 0),
    KEY ledger_client_date_index (client_id, occurred_on, id),
    KEY ledger_type_date_index (type, occurred_on),
    CONSTRAINT ledger_client_foreign FOREIGN KEY (client_id) REFERENCES clients (id),
    CONSTRAINT ledger_created_by_foreign FOREIGN KEY (created_by) REFERENCES administrators (id),
    CONSTRAINT ledger_voided_by_foreign FOREIGN KEY (voided_by) REFERENCES administrators (id),
    CONSTRAINT ledger_replacement_foreign FOREIGN KEY (replacement_entry_id) REFERENCES ledger_entries (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE login_attempts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(254) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    was_successful BOOLEAN NOT NULL,
    attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY login_attempt_lookup_index (email, ip_address, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    administrator_id BIGINT UNSIGNED NULL,
    action VARCHAR(120) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id BIGINT UNSIGNED NULL,
    metadata JSON NULL,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY audit_entity_index (entity_type, entity_id, created_at),
    CONSTRAINT audit_administrator_foreign FOREIGN KEY (administrator_id) REFERENCES administrators (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;