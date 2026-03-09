const { Employee, User } = require('../models');

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
        const { salary } = req.body;

        if (salary === undefined || salary === null) {
            return res.status(400).json({ error: 'Salary value is required' });
        }

        const employee = await Employee.findByPk(id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        await employee.update({ salary });
        res.json({ message: 'Salary updated successfully', employee });
    } catch (error) {
        console.error('Update salary error:', error);
        res.status(500).json({ error: 'Server error while updating salary' });
    }
};
