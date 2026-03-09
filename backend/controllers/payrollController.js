const { Employee, User, Salary } = require('../models');
const crypto = require('crypto');

// @desc    Get all employees with their salary info
// @route   GET /api/payroll/employees
// @access  Private (Admin, HR)
exports.getEmployeesWithSalaries = async (req, res) => {
    try {
        const employees = await Employee.findAll({
            include: [{
                model: User,
                attributes: ['email', 'role', 'employeeId']
            }],
            order: [['firstName', 'ASC']]
        });

        res.json(employees);
    } catch (error) {
        console.error('Get employees with salaries error:', error);
        res.status(500).json({ error: 'Server error while fetching employee salaries' });
    }
};

// @desc    Update employee salary
// @route   PUT /api/payroll/update-salary/:id
// @access  Private (Admin, HR)
exports.updateSalary = async (req, res) => {
    try {
        const { id } = req.params;
        const { baseSalary = 0, bonus = 0, deductions = 0 } = req.body;

        if (baseSalary === undefined || baseSalary === null) {
            return res.status(400).json({ error: 'Base Salary value is required' });
        }

        const employee = await Employee.findByPk(id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        const parsedBase = parseFloat(baseSalary) || 0;
        const parsedBonus = parseFloat(bonus) || 0;
        const parsedDeductions = parseFloat(deductions) || 0;
        const netSalary = parsedBase + parsedBonus - parsedDeductions;

        await employee.update({ 
            baseSalary: parsedBase, 
            bonus: parsedBonus, 
            deductions: parsedDeductions, 
            netSalary 
        });

        // Store history in Salaries table
        const date = new Date();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        await Salary.create({
            id: crypto.randomUUID(),
            employeeId: employee.id, // employeeId reference in Salaries table points to Employee model id
            basicSalary: parsedBase,
            bonus: parsedBonus,
            deductions: parsedDeductions,
            netSalary: netSalary,
            month: monthNames[date.getMonth()],
            year: date.getFullYear(),
            status: 'Paid' // Or whatever default matches the business logic
        });
        
        res.json({ message: 'Salary updated and logged successfully', employee });
    } catch (error) {
        console.error('Update salary error:', error);
        res.status(500).json({ error: 'Server error while updating salary' });
    }
};
