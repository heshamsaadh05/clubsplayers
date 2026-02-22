<?php
/**
 * Simple Input Validator
 */

class Validator {
    private array $errors = [];

    public function validate(array $data, array $rules): bool {
        $this->errors = [];

        foreach ($rules as $field => $ruleSet) {
            $value = $data[$field] ?? null;
            $fieldRules = is_string($ruleSet) ? explode('|', $ruleSet) : $ruleSet;

            foreach ($fieldRules as $rule) {
                $params = [];
                if (strpos($rule, ':') !== false) {
                    [$rule, $paramStr] = explode(':', $rule, 2);
                    $params = explode(',', $paramStr);
                }

                $error = $this->checkRule($field, $value, $rule, $params, $data);
                if ($error) {
                    $this->errors[$field][] = $error;
                }
            }
        }

        return empty($this->errors);
    }

    public function errors(): array {
        return $this->errors;
    }

    private function checkRule(string $field, $value, string $rule, array $params, array $data): ?string {
        switch ($rule) {
            case 'required':
                if ($value === null || $value === '') return "$field مطلوب";
                break;
            case 'email':
                if ($value && !filter_var($value, FILTER_VALIDATE_EMAIL)) return "البريد الإلكتروني غير صالح";
                break;
            case 'min':
                if ($value && strlen($value) < (int)$params[0]) return "$field يجب أن يكون {$params[0]} أحرف على الأقل";
                break;
            case 'max':
                if ($value && strlen($value) > (int)$params[0]) return "$field يجب أن لا يتجاوز {$params[0]} حرف";
                break;
            case 'numeric':
                if ($value && !is_numeric($value)) return "$field يجب أن يكون رقماً";
                break;
            case 'in':
                if ($value && !in_array($value, $params)) return "$field قيمة غير مقبولة";
                break;
            case 'unique':
                if ($value) {
                    $db = Database::getInstance();
                    $table = $params[0];
                    $column = $params[1] ?? $field;
                    $exceptId = $params[2] ?? null;
                    $query = "SELECT COUNT(*) FROM $table WHERE $column = ?";
                    $bindings = [$value];
                    if ($exceptId) {
                        $query .= " AND id != ?";
                        $bindings[] = $exceptId;
                    }
                    $stmt = $db->prepare($query);
                    $stmt->execute($bindings);
                    if ($stmt->fetchColumn() > 0) return "$field مستخدم بالفعل";
                }
                break;
        }
        return null;
    }
}
